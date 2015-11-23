SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
CXXFLAGS := -Wall ${ARCH} -O2 -std=c++0x

LIBGA := ${LDIR}/lib-ga.a
LIBS := ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h ${IDIR}/Graph_g.h ${IDIR}/List.h \
	 ${IDIR}/List_d.h ${IDIR}/egColor.h ${IDIR}/egcolor_l.h \
	 ${IDIR}/egcolor_bl.h ${IDIR}/egcolor_tl.h ${IDIR}/egcolor_mc.h \
	 ${IDIR}/egcolor_r.h ${IDIR}/egcolor_fc.h \
	 ${IDIR}/egcolor_menu.h ${IDIR}/egColor_rm.h ${IDIR}/egcolor_gm.h ${IDIR}/egcolor_vm.h 
OFILES = egColor.o egcolor_l.o egcolor_bl.o egcolor_tl.o egcolor_mc.o \
	 egcolor_r.o egcolor_fc.o egcolor_menu.o egColor_rm.o egcolor_gm.o egcolor_vm.o

${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBS} ${XFILES}

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

clean:
	rm -f *.o ${XFILES}
