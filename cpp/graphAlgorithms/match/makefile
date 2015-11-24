SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
CXXFLAGS := -Wall ${ARCH} -O2 -std=c++0x

LIBGA := ${LDIR}/lib-ga.a
LIBS := ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h ${IDIR}/Graph_w.h ${IDIR}/List.h \
	 ${IDIR}/Djsets_rl.h ${IDIR}/Djsets_flt.h ${IDIR}/matchb_hk.h \
	 ${IDIR}/matchwb_h.h ${IDIR}/match_egc.h ${IDIR}/match_eg.h \
	 ${IDIR}/match_egf.h \
	${IDIR}/matchb_gmg.h ${IDIR}/dmatch.h \
	${IDIR}/mdmatch.h ${IDIR}/mdmatch_f.h ${IDIR}/p2matchb_t.h
OFILES = matchb_f.o matchwb_f.o matchb_hk.o matchwb_h.o \
	match_egc.o match_eg.o match_egf.o matchb_gmg.o \
	mdmatch.o mdmatch_f.o p2matchb_t.o \
	dmatch.o

${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBS} ${XFILES}

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

clean:
	rm -f *.o ${XFILES}
