IDIR = ../../include
LDIR = ../../lib
LIB = ${LDIR}/lib-ds.a
ARCH := $(shell getconf LONG_BIT)
CXXFLAGS_32 = -O2 -m32 -I ${IDIR}
CXXFLAGS_64 = -O2 -m64 -I ${IDIR}
CXXFLAGS = $(CXXFLAGS_$(ARCH)) 
#CXXFLAGS = -O2 -m64 -I ${IDIR}
.cpp.o:
	${CXX} ${CXXFLAGS} -c $<

Pathset.o : ${IDIR}/stdinc.h ${IDIR}/Pathset.h
Dtrees.o :  ${IDIR}/stdinc.h ${IDIR}/Dtrees.h

all:	Pathset.o Dtrees.o
	ar -ru ${LIB} Pathset.o Dtrees.o 
	#make -C dvr IDIR='${IDIR}' LDIR='${LDIR}' BIN='${BIN}' \
        #            CXXFLAGS='${CXXFLAGS}' all

clean:
	rm -f *.o
	#make -C dvr clean
